import LayOut from './components/LayOut/LayOut'
import ResellerCustomer from './components/ResellerCustomer/ResellerCustomer'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './components/Login/Login'
import { ToastContainer } from 'react-toastify'
import ProtectedRoutes from './components/ProtectedRoutes/ProtectedRoutes'
import SubReseller from './components/SubReseller/SubReseller'
import Provider from './components/Provider/Provider'
import Overview from './components/Overview/Overview'

const routes = createBrowserRouter([

  {
    path: "/",
    element:
      <ProtectedRoutes >
        <Login />
      </ProtectedRoutes>
    ,
  },
  {
    path: "/layout",
    element:
      <ProtectedRoutes>
        <LayOut />
      </ProtectedRoutes>
    ,
    children: [
      {
        index: true,
        element:
          <ProtectedRoutes>
            <Overview />
          </ProtectedRoutes>
        ,
      },
      {
        path: "resellerCustomer",
        element:
          <ProtectedRoutes>
            <ResellerCustomer />
          </ProtectedRoutes>
        ,
      },
      {
        path: "provider",
        element: <ProtectedRoutes>
          <Provider />
        </ProtectedRoutes>
      },
      {
        path: "subReseller",
        element: <ProtectedRoutes>
          <SubReseller />
        </ProtectedRoutes>
      },
    ]
  }
])

function App() {
  return (
    <>
      <RouterProvider router={routes} />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        limit={4}
        newestOnTop
        closeOnClick={false}
        pauseOnFocusLoss={false}
        theme="light"
      />
    </>
  )
}

export default App
