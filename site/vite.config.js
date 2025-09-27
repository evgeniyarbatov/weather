import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    define: {
      __AWS_REGION__: JSON.stringify(env.VITE_AWS_REGION),
      __TABLE_NAME__: JSON.stringify(env.VITE_TABLE_NAME),
      __COGNITO_IDENTITY_POOL_ID__: JSON.stringify(env.VITE_COGNITO_IDENTITY_POOL_ID)
    },
    plugins: [react()],
  }
})