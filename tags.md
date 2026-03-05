---
layout: page
title: Tags
---

<script setup>
import { useRoute } from 'vitepress'

const route = useRoute()
const tag = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('tag')
  : null
</script>

<BlogList :tag="tag" />
