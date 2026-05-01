'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { NAMED_STARS, CATALOG_STARS, type StarEntry } from '@/lib/starCatalog'

const DEG2RAD = Math.PI / 180
const R = 500

function getSunRaDec(date: Date): { ra: number; dec: number } {
  const jd = date.getTime() / 86400000 + 2440587.5
  const n = jd - 2451545.0
  const L = (280.460 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * DEG2RAD
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG2RAD
  const eps = (23.439 - 0.0000004 * n) * DEG2RAD
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / DEG2RAD
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda)) / DEG2RAD
  return { ra: (ra + 360) % 360, dec }
}

function buildSunMesh(ra: number, dec: number): THREE.Object3D {
  const pos = raDecTo3D(ra, dec)
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0,   'rgba(255, 255, 200, 1.0)')
  grad.addColorStop(0.15,'rgba(255, 230, 100, 0.9)')
  grad.addColorStop(0.40,'rgba(255, 180,  50, 0.5)')
  grad.addColorStop(0.70,'rgba(255, 120,   0, 0.2)')
  grad.addColorStop(1.0, 'rgba(255, 80,    0, 0.0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(canvas)
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  const sprite = new THREE.Sprite(mat)
  sprite.position.copy(pos)
  sprite.scale.set(30, 30, 1)
  return sprite
}

function raDecTo3D(ra: number, dec: number): THREE.Vector3 {
  const raRad = ra * DEG2RAD
  const decRad = dec * DEG2RAD
  return new THREE.Vector3(
    R * Math.cos(decRad) * Math.sin(raRad),
    R * Math.sin(decRad),
    R * Math.cos(decRad) * Math.cos(raRad),
  )
}

function bvToRgb(bv: number): [number, number, number] {
  if (bv < -0.3) return [0.7, 0.8, 1.0]
  if (bv < 0.0)  return [0.82 + bv * 0.4, 0.90, 1.0]
  if (bv < 0.3)  return [1.0, 1.0, 1.0]
  if (bv < 0.6)  return [1.0, 0.97, 0.82]
  if (bv < 1.0)  return [1.0, 0.9, 0.6]
  if (bv < 1.4)  return [1.0, 0.75, 0.4]
  return [1.0, 0.5, 0.25]
}

function magToSize(mag: number): number {
  return Math.max(0.2, Math.min(9.0, (8.0 - mag) * 0.85 + 0.5))
}

function buildStarMesh(stars: StarEntry[]): THREE.Points {
  const positions: number[] = []
  const colors: number[] = []
  const sizes: number[] = []
  for (const s of stars) {
    const v = raDecTo3D(s.ra, s.dec)
    positions.push(v.x, v.y, v.z)
    const [r, g, b] = bvToRgb(s.bv ?? 0.0)
    colors.push(r, g, b)
    sizes.push(magToSize(s.mag))
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('starColor', new THREE.Float32BufferAttribute(colors, 3))
  geo.setAttribute('starSize', new THREE.Float32BufferAttribute(sizes, 1))
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
        gl_PointSize = starSize * (300.0 / length(mvPos.xyz));
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.2, 0.5, d);
        float glow = exp(-d * 6.0) * 0.6;
        gl_FragColor = vec4(vColor + glow, alpha * (0.2 + glow + (1.0 - d * 2.0) * 0.8));
      }
    `,
  })
  return new THREE.Points(geo, mat)
}

function buildMilkyWay(count: number): THREE.Points {
  const positions: number[] = []
  const colors: number[] = []
  const sizes: number[] = []
  for (let i = 0; i < count; i++) {
    const glon = Math.random() * Math.PI * 2
    const glat = ((Math.random() + Math.random() + Math.random() - 1.5) / 1.5) * (12 * DEG2RAD)
    const tilt = 63.0 * DEG2RAD
    const cosG = Math.cos(glat)
    const sinG = Math.sin(glat)
    const cosL = Math.cos(glon)
    const sinL = Math.sin(glon)
    const px = cosG * cosL
    const py = cosG * sinL * Math.cos(tilt) - sinG * Math.sin(tilt)
    const pz = cosG * sinL * Math.sin(tilt) + sinG * Math.cos(tilt)
    const norm = Math.sqrt(px * px + py * py + pz * pz)
    const rr = 498
    positions.push((rr * px) / norm, (rr * py) / norm, (rr * pz) / norm)
    const b = 0.35 + Math.random() * 0.35
    colors.push(b, b, Math.min(1, b + 0.06))
    sizes.push(0.2 + Math.random() * 0.6)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('starColor', new THREE.Float32BufferAttribute(colors, 3))
  geo.setAttribute('starSize', new THREE.Float32BufferAttribute(sizes, 1))
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
        gl_PointSize = starSize * (240.0 / length(mvPos.xyz));
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = (1.0 - smoothstep(0.2, 0.5, d)) * 0.45;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  })
  return new THREE.Points(geo, mat)
}

/**
 * 8~12등급 별 배경 필드 (구면 균등 분포, 15000개)
 * 실제 별 밀도: 어두운 별일수록 급격히 증가 → pow(random, 0.35)로 근사
 */
function buildFaintStarField(count: number): THREE.Points {
  const positions: number[] = []
  const colors: number[] = []
  const sizes: number[] = []
  for (let i = 0; i < count; i++) {
    const cosTheta = 2 * Math.random() - 1
    const phi = 2 * Math.PI * Math.random()
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta)
    positions.push(
      R * sinTheta * Math.cos(phi),
      R * cosTheta,
      R * sinTheta * Math.sin(phi),
    )
    const mag = 8.0 + Math.pow(Math.random(), 0.35) * 4.0
    const bv = 0.3 + Math.random() * 0.9
    const [r, g, b] = bvToRgb(bv)
    colors.push(r, g, b)
    sizes.push(magToSize(mag))
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('starColor', new THREE.Float32BufferAttribute(colors, 3))
  geo.setAttribute('starSize', new THREE.Float32BufferAttribute(sizes, 1))
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
        gl_PointSize = starSize * (300.0 / length(mvPos.xyz));
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = (1.0 - smoothstep(0.1, 0.5, d)) * 0.8;
        gl_FragColor = vec4(vColor, alpha);
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

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020817)

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // 레이어 순서: 어두운 별 → 은하수 → 밝은 카탈로그 별 → 태양
    scene.add(buildFaintStarField(15000))
    scene.add(buildMilkyWay(6000))
    const allStars = [...NAMED_STARS, ...CATALOG_STARS]
    scene.add(buildStarMesh(allStars))
    const sunPos = getSunRaDec(new Date())
    scene.add(buildSunMesh(sunPos.ra, sunPos.dec))

    // Horizon haze
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

    let pointerDown = false
    let lastX = 0
    let lastY = 0
    let rotX = 0.3
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
