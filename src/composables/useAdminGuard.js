export function useAdminGuard(router) {
  router.beforeEach((to, from, next) => {
    const isAdminRoute = to.path.startsWith('/admin') && to.name !== 'AdminLogin'
    const isAuthenticated = localStorage.getItem('admin-auth') === 'true'
    if (isAdminRoute && !isAuthenticated) {
      next({ name: 'AdminLogin' })
    } else {
      next()
    }
  })
}
