'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface StarData {
  positions: number[]
  colors: number[]
  sizes: number[]
}

function generateStars(count: number): StarData {
  const positions: number[] = []
  const colors: number[] = []
  const sizes: number[] = []
  const R = 500

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(2 * Math.random() - 1)
    const theta = Math.random() * Math.PI * 2
    positions.push(
      R * Math.sin(phi) * Math.cos(theta),
      R * Math.sin(phi) * Math.sin(theta),
      R * Math.cos(phi),
    )

    const rnd = Math.random()
    if (rnd < 0.55) {
      // blue-white
      colors.push(0.82 + Math.random() * 0.18, 0.85 + Math.random() * 0.15, 1.0)
    } else if (rnd < 0.78) {
      // white
      colors.push(1, 1, 1)
    } else if (rnd < 0.92) {
      // yellow
      colors.push(1, 0.92 + Math.random() * 0.08, 0.6 + Math.random() * 0.3)
    } else {
      // orange-red
      colors.push(1, 0.45 + Math.random() * 0.35, 0.2 + Math.random() * 0.2)
    }

    // Magnitude distribution: most stars are dim
    const mag = Math.pow(Math.random(), 1.8)
    sizes.push(Math.max(0.5, (1 - mag) * 4.5))
  }

  return { positions, colors, sizes }
}

function generateMilkyWay(count: number): StarData {
  const positions: number[] = []
  const colors: number[] = []
  const sizes: number[] = []
  const R = 498 // slightly smaller radius to avoid z-fighting

  for (let i = 0; i < count; i++) {
    const glon = Math.random() * Math.PI * 2
    // Gaussian spread around galactic plane ±10°
    const glat =
      ((Math.random() + Math.random() + Math.random() - 1.5) / 1.5) * (12 * Math.PI) / 180

    // Approximate galactic-to-equatorial rotation (tilt ~63°)
    const tilt = 63.0 * (Math.PI / 180)
    const cosG = Math.cos(glat)
    const sinG = Math.sin(glat)
    const cosL = Math.cos(glon)
    const sinL = Math.sin(glon)

    const px = cosG * cosL
    const py = cosG * sinL * Math.cos(tilt) - sinG * Math.sin(tilt)
    const pz = cosG * sinL * Math.sin(tilt) + sinG * Math.cos(tilt)
    const norm = Math.sqrt(px * px + py * py + pz * pz)

    positions.push((R * px) / norm, (R * py) / norm, (R * pz) / norm)

    const b = 0.45 + Math.random() * 0.4
    colors.push(b, b, Math.min(1, b + 0.05))
    sizes.push(0.3 + Math.random() * 0.7)
  }

  return { positions, colors, sizes }
}

function buildPointMesh(data: StarData): THREE.Points {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3))
  geo.setAttribute('starColor', new THREE.Float32BufferAttribute(data.colors, 3))
  geo.setAttribute('starSize', new THREE.Float32BufferAttribute(data.sizes, 1))

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `
      attribute vec3 starColor;
      attribute float starSize;
      varying vec3 vColor;
      void main() {
        vColor = starColor;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = starSize * (320.0 / length(mvPos.xyz));
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.25, 0.5, d);
        float glow = exp(-d * 7.0) * 0.5;
        gl_FragColor = vec4(vColor + glow, alpha * (0.15 + glow + (1.0 - d * 2.0) * 0.85));
      }
    `,
  })

  return new THREE.Points(geo, mat)
}

export default function StarCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Scene ──────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020817)

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    )
    camera.position.set(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // ── Stars ───────────────────────────────────────────────────
    scene.add(buildPointMesh(generateStars(5000)))
    scene.add(buildPointMesh(generateMilkyWay(7000)))

    // ── Atmosphere haze near horizon ────────────────────────────
    const hazeGeo = new THREE.CylinderGeometry(490, 490, 80, 64, 1, true)
    const hazeMat = new THREE.MeshBasicMaterial({
      color: 0x0a1e3d,
      transparent: true,
      opacity: 0.55,
      side: THREE.BackSide,
      depthWrite: false,
    })
    const haze = new THREE.Mesh(hazeGeo, hazeMat)
    haze.position.y = -40
    scene.add(haze)

    // ── Interaction ─────────────────────────────────────────────
    let pointerDown = false
    let lastX = 0
    let lastY = 0
    let rotX = 0.3 // slight upward tilt (looking toward zenith)
    let rotY = 0
    let targetRotX = 0.3
    let targetRotY = 0

    const onPointerDown = (e: PointerEvent) => {
      pointerDown = true
      lastX = e.clientX
      lastY = e.clientY
      renderer.domElement.style.cursor = 'grabbing'
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerDown) return
      targetRotY += (e.clientX - lastX) * 0.0018
      targetRotX += (e.clientY - lastY) * 0.0018
      targetRotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotX))
      lastX = e.clientX
      lastY = e.clientY
    }
    const onPointerUp = () => {
      pointerDown = false
      renderer.domElement.style.cursor = 'grab'
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Animation ───────────────────────────────────────────────
    let autoRot = 0
    let rafId: number

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      rotX += (targetRotX - rotX) * 0.06
      rotY += (targetRotY - rotY) * 0.06
      if (!pointerDown) autoRot += 0.000035
      camera.quaternion.setFromEuler(new THREE.Euler(rotX, rotY + autoRot, 0, 'YXZ'))
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0"
      style={{ cursor: 'grab' }}
    />
  )
}
