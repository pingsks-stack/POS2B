export default function (context) {
  const auth = context.store.state.auth
  if (auth && auth.loggedIn) {
    const role = auth.user && auth.user.ref_id_role ? auth.user.ref_id_role.position : ''
    if (role === 'cashier' || role === 'staff') {
      return context.redirect('/seller')
    }
    if (role === 'admin' || role === 'manager' || role === 'checker') {
      return context.redirect('/manage')
    }
    return context.redirect('/member')
  }
}
