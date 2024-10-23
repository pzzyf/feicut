<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { fabric } from 'fabric'

let canvas
let image
const canvasRef = ref(null)

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (canvas) {
    canvas.dispose()
  }
  window.removeEventListener('resize', resizeCanvas)
})

function initCanvas() {
  canvas = new fabric.Canvas(canvasRef.value, {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#ffffff',
  })

  fabric.Image.fromURL('/hand.jpg', (img) => {
    if (!img) {
      console.error('Failed to load image')
      return
    }
    image = img
    image.set({
      left: 400,
      top: 200,
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerColor: 'blue',
      cornerStrokeColor: 'blue',
      borderColor: 'blue',
      cornerSize: 10,
      padding: 5,
      borderDashArray: [5, 5],
    })
    canvas.add(image)
    customizeImageControls(image)
    canvas.renderAll()
  }, (error) => {
    console.error('Error loading image:', error)
  })

  canvas.on('object:moving', snapToGrid)
  canvas.on('object:scaling', snapToGrid)
  canvas.on('object:rotating', snapToGrid)

  window.addEventListener('resize', resizeCanvas)
}

function customizeImageControls(obj) {
  obj.setControlsVisibility({
    mt: true,
    mb: true,
    ml: true,
    mr: true,
    tl: true,
    tr: true,
    bl: true,
    br: true,
    mtr: true,
  })

  // 为四个角落的控制点自定义 actionHandler
  ;['tl', 'tr', 'bl', 'br'].forEach((corner) => {
    obj.controls[corner].actionHandler = function (eventData, transform, x, y) {
      const target = transform.target
      const localPoint = target.toLocalPoint(new fabric.Point(x, y), 'center', 'center')
      const originalWidth = target.width * target.scaleX
      const originalHeight = target.height * target.scaleY
      const ratio = originalWidth / originalHeight

      let newWidth, newHeight

      if (corner === 'tl' || corner === 'br') {
        newWidth = Math.abs(localPoint.x * 2)
        newHeight = newWidth / ratio
      }
      else {
        newHeight = Math.abs(localPoint.y * 2)
        newWidth = newHeight * ratio
      }

      const newScaleX = newWidth / target.width
      const newScaleY = newHeight / target.height

      // 确保新尺寸不小于最小值
      const minSize = 20
      if (newWidth < minSize || newHeight < minSize) {
        return false
      }

      // 计算新的位置，以保持对角点不动
      let newLeft = target.left
      let newTop = target.top
      if (corner === 'tl') {
        newLeft += originalWidth - newWidth
        newTop += originalHeight - newHeight
      }
      else if (corner === 'tr') {
        newTop += originalHeight - newHeight
      }
      else if (corner === 'bl') {
        newLeft += originalWidth - newWidth
      }

      target.set({
        scaleX: newScaleX,
        scaleY: newScaleY,
        left: newLeft,
        top: newTop,
      })

      return true
    }
  })

  // 修改上下左右控制点的行为
  ;['mt', 'mb', 'ml', 'mr'].forEach((control) => {
    obj.controls[control].actionHandler = function (eventData, transform, x, y) {
      const target = transform.target
      const localPoint = target.toLocalPoint(new fabric.Point(x, y), transform.originX, transform.originY)
      const width = target.width * target.scaleX
      const height = target.height * target.scaleY

      if (control === 'mt' || control === 'mb') {
        let newHeight, newTop
        if (control === 'mt') {
          newHeight = height - localPoint.y
          newTop = target.top + localPoint.y
        }
        else {
          newHeight = localPoint.y
          newTop = target.top
        }
        const newScaleY = newHeight / target.height
        target.set({
          top: newTop,
          height: newHeight,
          scaleY: newScaleY,
        })
      }
      else {
        let newWidth, newLeft
        if (control === 'ml') {
          newWidth = width - localPoint.x
          newLeft = target.left + localPoint.x
        }
        else {
          newWidth = localPoint.x
          newLeft = target.left
        }
        const newScaleX = newWidth / target.width
        target.set({
          left: newLeft,
          width: newWidth,
          scaleX: newScaleX,
        })
      }

      target.setCoords()
      canvas.requestRenderAll()
      return true
    }
  })

  // 恢复原生的旋转控制
  obj.controls.mtr.actionHandler = fabric.controlsUtils.rotationWithSnapping
}

function snapToGrid(event) {
  const obj = event.target
  const threshold = 10
  const canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 }
  const objBounds = obj.getBoundingRect(true)
  const objCenter = { x: objBounds.left + objBounds.width / 2, y: objBounds.top + objBounds.height / 2 }

  const guidelines = [
    { value: 0, type: 'horizontal', name: '上边框' },
    { value: canvasCenter.y, type: 'horizontal', name: '水平中线' },
    { value: canvas.height, type: 'horizontal', name: '下边框' },
    { value: 0, type: 'vertical', name: '左边框' },
    { value: canvasCenter.x, type: 'vertical', name: '竖直中线' },
    { value: canvas.width, type: 'vertical', name: '右边框' },
  ]

  const objGuidelines = [
    { value: objBounds.top, type: 'horizontal', name: '上边框' },
    { value: objCenter.y, type: 'horizontal', name: '水平中线' },
    { value: objBounds.top + objBounds.height, type: 'horizontal', name: '下边框' },
    { value: objBounds.left, type: 'vertical', name: '左边框' },
    { value: objCenter.x, type: 'vertical', name: '竖直中线' },
    { value: objBounds.left + objBounds.width, type: 'vertical', name: '右边框' },
  ]

  canvas.getObjects('line').forEach(line => canvas.remove(line))

  let snapped = false
  guidelines.forEach((canvasGuide) => {
    objGuidelines.forEach((objGuide) => {
      if (canvasGuide.type === objGuide.type && Math.abs(canvasGuide.value - objGuide.value) < threshold) {
        if (canvasGuide.type === 'horizontal') {
          obj.set('top', obj.top + canvasGuide.value - objGuide.value)
          drawGuideline(0, canvasGuide.value, canvas.width, canvasGuide.value)
        }
        else {
          obj.set('left', obj.left + canvasGuide.value - objGuide.value)
          drawGuideline(canvasGuide.value, 0, canvasGuide.value, canvas.height)
        }
        // console.log(`画布的${canvasGuide.name}与元素的${objGuide.name}对齐`)
        snapped = true
      }
    })
  })

  if (snapped) {
    canvas.renderAll()
  }
}

function drawGuideline(x1, y1, x2, y2) {
  const line = new fabric.Line([x1, y1, x2, y2], {
    stroke: 'blue',
    strokeWidth: 1,
    selectable: false,
    evented: false,
  })
  canvas.add(line)
}

function resizeCanvas() {
  canvas.setDimensions({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  canvas.renderAll()
}
</script>

<template>
  <div>
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
canvas {
  border: 1px solid #ccc;
}
</style>
