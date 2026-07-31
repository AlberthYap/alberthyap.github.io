<script setup lang="ts">
/**
 * HeroDashboard — 3D-tilted glass-panel mockup with animated metrics.
 *
 * Extracted from Hero.vue so the parent stays readable; the dashboard
 * owns its own markup + CSS shells.
 *
 * a11y is layered: decorative dots aria-hidden since the chrome caption
 * labels the panel; metrics get `role="status"` + `aria-live` so screen
 * readers announce value changes; editor/infra each get role + aria-label.
 *
 * Reduced-motion lives in CSS — `.perspective-panel`'s rotation collapses
 * to `transform: none` under `prefers-reduced-motion: reduce`.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { useCountUp } from '~~/app/composables/useCountUp'

const uptimeCount = useCountUp(99.99, 1800, 2)
const latencyCount = useCountUp(12, 1400, 0)

let uptimeTimer: ReturnType<typeof setTimeout> | null = null
let latencyTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  // Stagger count-up after the reveal cascade (900 ms panel delay + buffer).
  uptimeTimer = setTimeout(() => uptimeCount.animate(), 1000)
  latencyTimer = setTimeout(() => latencyCount.animate(), 1200)
})

onBeforeUnmount(() => {
  if (uptimeTimer !== null) clearTimeout(uptimeTimer)
  if (latencyTimer !== null) clearTimeout(latencyTimer)
})
</script>

<template>
  <div class="perspective-panel">
    <div class="dashboard-mock">
      <div class="dashboard-mock__chrome">
        <span class="dashboard-mock__dots" aria-hidden="true">
          <span class="dashboard-mock__dot--red" />
          <span class="dashboard-mock__dot--yellow" />
          <span class="dashboard-mock__dot--green" />
        </span>
        <span class="dashboard-mock__caption">portfolio_v2</span>
      </div>
      <div class="dashboard-mock__body">
        <div
          class="dashboard-mock__metrics"
          role="group"
          aria-label="Build metrics"
        >
          <div
            class="dashboard-mock__metric"
            role="status"
            aria-live="polite"
            :aria-label="`Uptime: ${uptimeCount.count.value} percent`"
          >
            <span class="dashboard-mock__metric-label">Uptime</span>
            <span class="dashboard-mock__metric-value">{{ uptimeCount.count.value }}%</span>
          </div>
          <div
            class="dashboard-mock__metric"
            role="status"
            aria-live="polite"
            :aria-label="`Latency: ${latencyCount.count.value} milliseconds`"
          >
            <span class="dashboard-mock__metric-label">Latency</span>
            <span class="dashboard-mock__metric-value dashboard-mock__metric-value--default">
              {{ latencyCount.count.value }}ms
            </span>
          </div>
        </div>

        <!-- v-pre on the <pre> tells Vue's SFC compiler to skip template processing
             for the engine.ts snippet below (no mustache interpolation, no directive lookups). -->
        <div
          class="dashboard-mock__editor"
          role="region"
          aria-label="engine.ts source"
        >
          <div class="dashboard-mock__editor-tabs" aria-hidden="true">
            <span class="dashboard-mock__editor-tab dashboard-mock__editor-tab--active">
              engine.ts
            </span>
            <span class="dashboard-mock__editor-tab">main.ts</span>
            <span class="dashboard-mock__editor-tab">config.yml</span>
          </div>
          <pre v-pre class="dashboard-mock__editor-body"><code><span class="dashboard-mock__editor-keyword">class</span> <span class="dashboard-mock__editor-fn">Engine</span> {
  <span class="dashboard-mock__editor-keyword">async</span> <span class="dashboard-mock__editor-fn">optimize</span>(speed: <span class="dashboard-mock__editor-type">number</span>): <span class="dashboard-mock__editor-keyword">Promise</span>&lt;<span class="dashboard-mock__editor-type">void</span>&gt; {
    <span class="dashboard-mock__editor-comment">// Deploy to globally distributed edge nodes</span>
    <span class="dashboard-mock__editor-keyword">await</span> <span class="dashboard-mock__editor-keyword">this</span>.deployToEdge();
    <span class="dashboard-mock__editor-keyword">await</span> <span class="dashboard-mock__editor-keyword">this</span>.monitorPerformance();
  }
}</code></pre>
        </div>

        <div
          class="dashboard-mock__infra"
          role="img"
          aria-label="Edge node topology: two origins joined by one edge ring"
        >
          <div class="dashboard-mock__infra-row" aria-hidden="true">
            <span class="dashboard-mock__infra-node" />
            <span class="dashboard-mock__infra-bar" />
            <span class="dashboard-mock__infra-node dashboard-mock__infra-node--ring" />
            <span class="dashboard-mock__infra-bar" />
            <span class="dashboard-mock__infra-node" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
