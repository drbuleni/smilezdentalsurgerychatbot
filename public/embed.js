/**
 * Smilez Dental Chatbot — JavaScript Embed Script
 *
 * Add this to any website (including Wix via HTML element):
 *
 *   <script
 *     src="https://YOUR-APP.vercel.app/embed.js"
 *     data-widget-url="https://YOUR-APP.vercel.app/widget">
 *   </script>
 *
 * The script creates a fixed-position iframe in the bottom-right corner.
 * No styling dependencies required.
 */
;(function () {
  'use strict'

  // Avoid double-loading
  if (window.__smilezChatLoaded) return
  window.__smilezChatLoaded = true

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script')
    return scripts[scripts.length - 1]
  })()

  var widgetUrl =
    script.getAttribute('data-widget-url') ||
    script.src.replace('/embed.js', '/widget')

  var width = script.getAttribute('data-width') || '400px'
  var height = script.getAttribute('data-height') || '650px'
  var bottom = script.getAttribute('data-bottom') || '0'
  var right = script.getAttribute('data-right') || '0'

  function createWidget() {
    var container = document.createElement('div')
    container.id = 'smilez-chat-container'
    container.style.cssText = [
      'position: fixed',
      'bottom: ' + bottom,
      'right: ' + right,
      'width: ' + width,
      'height: ' + height,
      'z-index: 2147483647',
      'border: none',
      'pointer-events: none',
    ].join('; ')

    var iframe = document.createElement('iframe')
    iframe.src = widgetUrl
    iframe.id = 'smilez-chat-iframe'
    iframe.title = 'Smilez Dental Assistant'
    iframe.setAttribute('allow', 'clipboard-write')
    iframe.setAttribute('loading', 'lazy')
    iframe.style.cssText = [
      'width: 100%',
      'height: 100%',
      'border: none',
      'pointer-events: auto',
      'background: transparent',
    ].join('; ')

    container.appendChild(iframe)
    document.body.appendChild(container)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget)
  } else {
    createWidget()
  }
})()
