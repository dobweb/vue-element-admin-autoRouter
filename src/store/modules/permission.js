import { asyncRoutes, constantRoutes } from '@/router'
import Layout from '@/layout/index'

/**
 * Use meta.role to determine if the current user has permission
 * @param roles
 * @param route
 */
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

/**
 * Filter asynchronous routing tables by recursion
 * @param routes asyncRoutes
 * @param roles
 */
export function filterAsyncRoutes(routes, roles) {
  const res = []

  routes.forEach(item => {
    const tmp = { ...routes }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
      }
      res.push(tmp)
    }
  })
}

export function filerAsyncComponent(name, index = false) { // new Add
  const result = () => import(`@/${name}${index ? '/index' : ''}.vue`)
  return result
}

export function filterAsyncMenuRoutes(accessedRoutes, routes) { // new Add
  routes.forEach(item => {
    const menu = {
      path: item.path,
      component: !item.url ? Layout : filerAsyncComponent(item.url),
      hidden: item.hidden ? item.hidden : false,
      children: [],
      name: item.name,
      meta: { title: item.name, icon: item.hasOwnProperty('icon') ? item.icon : '' }
    }
    // if (item.redirect) {
    //   menu.redirect = item.redirect
    // }
    if (item.children) {
      filterAsyncMenuRoutes(menu.children, item.children)
    }
    accessedRoutes.push(menu)
  })
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  generateRoutes({ commit }, params) { // change
    return new Promise(resolve => {
      const roles = params.roles // new Add
      const menu = params.menu // new Add

      let accessedRoutes

      if (roles.includes('admin')) {
        accessedRoutes = asyncRoutes || []
      } else {
        accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
      }

      filterAsyncMenuRoutes(accessedRoutes, menu) // new Add

      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
