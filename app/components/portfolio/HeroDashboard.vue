<script setup lang="ts">
/**
 * HeroDashboard — 3D-tilted glass-panel mockup.
 *
 * Extracted from Hero.vue so the parent stays readable; the dashboard
 * owns its own markup + CSS shells.
 *
 * a11y is layered: decorative dots aria-hidden since the chrome caption
 * labels the panel; metrics/editor/infra each get role + aria-label so
 * screen readers + keyboard nav don't read them as unlabeled sprites.
 *
 * Reduced-motion lives in CSS — `.perspective-panel`'s rotation collapses
 * to `transform: none` under `prefers-reduced-motion: reduce`.
 */
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
          <div class="dashboard-mock__metric">
            <span class="dashboard-mock__metric-label">Uptime</span>
            <span class="dashboard-mock__metric-value">99.99%</span>
          </div>
          <div class="dashboard-mock__metric">
            <span class="dashboard-mock__metric-label">Latency</span>
            <span class="dashboard-mock__metric-value dashboard-mock__metric-value--default">
              12ms
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
