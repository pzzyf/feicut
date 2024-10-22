<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Canvas, Image, Line } from 'fabric'

let canvas
const canvasRef = ref(null)

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (canvas) {
    canvas.dispose()
  }
})

function initCanvas() {
  canvas = new Canvas(canvasRef.value, {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 'white',
  })

  // 加载图片
  Image.fromURL('/hand.jpg', (img) => {
    img.set({
      left: 100,
      top: 100,
      cornerColor: 'blue',
      cornerStrokeColor: 'blue',
      borderColor: 'blue',
      cornerSize: 12,
      transparentCorners: false,
      lockUniScaling: false, // 允许非等比缩放
    })
    canvas.add(img)
    canvas.setActiveObject(img)
  })

  // 添加对齐线
  canvas.on('object:moving', alignObject)
  canvas.on('object:scaling', alignObject)
  canvas.on('object:rotating', alignObject)

  // 添加窗口大小变化的监听器
  window.addEventListener('resize', resizeCanvas)
}

function resizeCanvas() {
  canvas.setDimensions({
    width: window.innerWidth,
    height: window.innerHeight,
  })
}

function alignObject(e) {
  const activeObject = e.target
  const canvasCenter = canvas.getCenter()
  const objectCenter = activeObject.getCenterPoint()
  const objectBounds = activeObject.getBoundingRect()
  const snapThreshold = 10

  const lines = []

  // 水平对齐
  if (Math.abs(objectCenter.y - canvasCenter.y) < snapThreshold) {
    activeObject.set({ top: canvasCenter.y - objectBounds.height / 2 })
    lines.push(new Canvas.Line([0, canvasCenter.y, canvas.width, canvasCenter.y], {
      stroke: 'blue',
      strokeWidth: 1,
      selectable: false,
    }))
  }

  // 垂直对齐
  if (Math.abs(objectCenter.x - canvasCenter.x) < snapThreshold) {
    activeObject.set({ left: canvasCenter.x - objectBounds.width / 2 })
    lines.push(new Canvas.Line([canvasCenter.x, 0, canvasCenter.x, canvas.height], {
      stroke: 'blue',
      strokeWidth: 1,
      selectable: false,
    }))
  }

  // 清除旧的对齐线
  canvas.getObjects('line').forEach(line => canvas.remove(line))

  // 添加新的对齐线
  lines.forEach(line => canvas.add(line))

  canvas.renderAll()
}
</script>

<template>
  <canvas ref="canvas" />
</template>

<style scoped>
canvas {
  border: 1px solid #ccc;
}
</style>
