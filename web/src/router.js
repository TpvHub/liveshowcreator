import AddUser from './components/users/add-user'
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
    path: '/document/:id/edit',
    component: Authenticate(EditDocument)
  },
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/forgot-password',
    component: ForgotPassword,
  },
  {
    path: '/users',
    component: Authenticate(Users)
  },
  {
    path: '/clients',
    component: Authenticate(Clients)
  },
  {
    path: '/clients/:clientId/users',
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
  {
    path: '/backups',
    component: Authenticate(Backups)
  }

]