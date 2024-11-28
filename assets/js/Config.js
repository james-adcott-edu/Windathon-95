export const web_root = document.URL.substring(0, document.URL.length - 1)
export const environment = document.URL.includes('localhost') ? 'development' : 'production'
