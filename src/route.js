export const getRoute = () => {
  const currentPathname = window.location.pathname

  if (currentPathname === '/') return 'main'
  if (currentPathname === '/testbed') return 'testbed'
  return 'main'
}
