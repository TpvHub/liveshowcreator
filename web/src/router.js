import AddUser from './components/users/add-user'
import AddClient from './components/clients/add-client'
import EditClient from './components/clients/edit-client'
import Register from './components/register'
import Documents from './components/documents'
import Login from './components/login'
import ForgotPassword from './components/forgot-password'
import Authenticate from './components/authenticate'
import Users from './components/users'
import Clients from './components/clients'
import EditUser from './components/users/edit-user'
import EditDocument from './components/documents/edit-document'
import Backups from './components/backups'

export const routes = [
  {
    path: '/',
    component: Authenticate(Documents),
  },
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/register',
    component: Register
  },
  {
    path: '/forgot-password',
    component: ForgotPassword,
  },

  // Client routes
  {
    path: '/clients',
    component: Authenticate(Clients)
  },
  {
    path: '/clients/create',
    component: AddClient
  },
  {
    path: '/clients/:clientId/edit',
    component: Authenticate(EditClient)
  },
  {
    path: '/clients/:clientId/users',
    component: Authenticate(Users)
  },

  // User routes
  {
    path: '/users',
    component: Authenticate(Users)
  },
  {
    path: '/users/create',
    component: Authenticate(AddUser)
  },
  {
    path: '/users/:id/edit',
    component: Authenticate(EditUser)
  },

  // Document routes
  {
    path: '/documents',
    component: Authenticate(Documents),
  },
  {
    path: '/document/:id/edit',
    component: Authenticate(EditDocument)
  },
  {
    path: '/backups',
    component: Authenticate(Backups)
  }

]