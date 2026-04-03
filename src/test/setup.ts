import '@testing-library/jest-dom'

// Recharts usa ResizeObserver, que não existe no jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
