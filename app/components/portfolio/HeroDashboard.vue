<script setup lang="ts">
/**
 * HeroDashboard — 3D-tilted glass-panel mockup.
 *
 * Reproduces the `portfolio_v2` panel from example.html on the
 * right side of the hero. Extracted from Hero.vue so the parent stays
 * readable; the dashboard owns its own markup + styling shells.
 *
 * Visual stack (top → bottom):
 *   1. Chrome bar — three coloured dots + `portfolio_v2` caption.
 *   2. Metrics row — two cards: UPTIME (primary) and LATENCY (default).
 *   3. Code editor — dark inverse block with `engine.ts` highlighted
 *      tab and a TypeScript snippet demonstrating the engine contract.
 *   4. Infrastructure visual — two origin nodes (left + right
 *      endpoints) joined by a single edge ring at the centre,
 *      representing globally distributed edge delivery.
 *
 * a11y:
 *   • Decorative dots are aria-hidden (the chrome's `portfolio_v2`
 *     caption already labels the panel).
 *   • Metrics carry a `role="group"` + `aria-label` so screen readers
 *     announce "Build metrics, two items" before the values.
 *   • Editor carries `role="region"` + `aria-label="engine.ts source"`
 *     for keyboard navigation between editor/value regions.
 *   • Infrastructure visual carries `role="img"` + `aria-label`
 *     describing the graph; without this, the three nodes + bars read
 *     as unlabeled sprites.
 *
 * Reduced-motion: handled in CSS — `.perspective-panel` rotation
 * collapses to `transform: none` under `prefers-reduced-motion: reduce`.
 */
</script>

<template>
  <div class="perspective-panel">
    <div class="dashboard-mock">
      <!-- Chrome bar: 3 mac-style dots + tab caption -->
      <div class="dashboard-mock__chrome">
        <span class="dashboard-mock__dots" aria-hidden="true">
          <span class="dashboard-mock__dot--red" />
          <span class="dashboard-mock__dot--yellow" />
          <span class="dashboard-mock__dot--green" />
        </span>
        <span class="dashboard-mock__caption">portfolio_v2</span>
      </div>

      <!-- Body stack -->
      <div class="dashboard-mock__body">
        <!-- Metrics row -->
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

        <!-- Code editor — TypeScript snippet showcasing the engine
             contract transform. `v-pre` on the <pre> element tells
             Vue's SFC compiler to skip template processing for the
             subtree (no mustache interpolation, no directive lookups).
             Static class attributes on descendant spans still render. -->
        <div
          class="dashboard-mock__editor"
          role="region"
          aria-label="engine.ts source"
        >
          <div
            class="dashboard-mock__editor-tabs"
            aria-hidden="true"
          >
            <span class="dashboard-mock__editor-tab dashboard-mock__editor-tab--active">
              engine.ts
            </span>
            <span class="dashboard-mock__editor-tab">main.ts</span>
            <span class="dashboard-mock__editor-tab">config.yml</span>
          </div>
          <pre
            v-pre
            class="dashboard-mock__editor-body"
          ><code><span class="dashboard-mock__editor-keyword">class</span> <span class="dashboard-mock__editor-fn">Engine</span> {
  <span class="dashboard-mock__editor-keyword">async</span> <span class="dashboard-mock__editor-fn">optimize</span>(speed: <span class="dashboard-mock__editor-type">number</span>): <span class="dashboard-mock__editor-keyword">Promise</span>&lt;<span class="dashboard-mock__editor-type">void</span>&gt; {
    <span class="dashboard-mock__editor-comment">// Deploy to globally distributed edge nodes</span>
    <span class="dashboard-mock__editor-keyword">await</span> <span class="dashboard-mock__editor-keyword">this</span>.deployToEdge();
    <span class="dashboard-mock__editor-keyword">await</span> <span class="dashboard-mock__editor-keyword">this</span>.monitorPerformance();
  }
}</code></pre>
        </div>

        <!-- Infrastructure visual: two origin nodes (left + right
             endpoints) joined by a single edge ring at the centre. -->
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
