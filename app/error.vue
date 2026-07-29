<script setup lang="ts">
import { computed } from 'vue'

import Heading from '~~/app/components/ui/Heading.vue'
import LinkButton from '~~/app/components/ui/LinkButton.vue'
import Footer from '~~/app/components/layout/Footer.vue'
import Navbar from '~~/app/components/layout/Navbar.vue'
import PageContainer from '~~/app/components/layout/PageContainer.vue'

import { SITE_NAME } from '~~/shared/constants/site'

interface NuxtError {
  statusCode?: number
  statusMessage?: string
  message?: string
}

const props = defineProps<{ error: NuxtError }>()

const status = computed(() => props.error.statusCode ?? 500)
const heading = computed(() => (status.value === 404 ? 'Page not found' : 'Something went wrong'))
const detail = computed(() => (status.value === 404
  ? "The page you're looking for doesn't exist or has moved."
  : props.error.message ?? 'An unexpected error occurred.'))

function handleError() {
  clearError({ redirect: '/' })
}

useSeoMeta({
  title: `${heading.value} — ${SITE_NAME}`,
  description: detail.value,
})
</script>

<template>
  <div>
    <Navbar />
    <main id="main-content" class="flex-1 focus:outline-none" tabindex="-1">
      <PageContainer width="narrow" class="py-32 flex flex-col items-start gap-6">
        <Heading as="h1">{{ heading }}</Heading>
        <p class="text-lg text-muted">{{ detail }}</p>
        <LinkButton to="/" variant="primary" size="lg" @click="handleError">
          Back to home
        </LinkButton>
      </PageContainer>
    </main>
    <Footer />
  </div>
</template>
