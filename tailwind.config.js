/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{vue,uvue}',
    './components/**/*.{vue,uvue}',
    './App.{vue,uvue}'
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': '#FF9F43',
        'bg-base': '#F8F9FA',
        'bg-card': '#FFFFFF',
        'status-green': '#52C41A',
        'status-warning': '#FA8C16',
        'status-danger': '#F5222D',
        'text-main': '#333333',
        'text-sub': '#666666'
      }
    }
  },
  corePlugins: {
    flex: true,
    margin: true,
    padding: true,
    border: true,
    'border-radius': true,
    width: true,
    height: true,
    'font-size': true,
    'font-weight': true,
    color: true,
    'text-align': true,
    'line-height': true,
    'background-color': true,
    opacity: true,
    shadow: false,
    grid: false,
    float: false
  }
}
