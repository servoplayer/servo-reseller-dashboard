import LayOut from './components/LayOut/LayOut'
import ResellerCustomer from './components/ResellerCustomer/ResellerCustomer'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './components/Login/Login'
import { ToastContainer } from 'react-toastify'
import ProtectedRoutes from './components/ProtectedRoutes/ProtectedRoutes'
import RoleGate from './components/ProtectedRoutes/RoleGate'
import SubReseller from './components/SubReseller/SubReseller'
import Provider from './components/Provider/Provider'
import Overview from './components/Overview/Overview'
import ManagerResellers from './components/ManagerResellers/ManagerResellers'
import CreditHistory from './components/CreditHistory/CreditHistory'

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
            <RoleGate only="reseller">
              <Overview />
            </RoleGate>
          </ProtectedRoutes>
        ,
      },
      {
        path: "resellerCustomer",
        element:
          <ProtectedRoutes>
            <RoleGate only="reseller">
              <ResellerCustomer />
            </RoleGate>
          </ProtectedRoutes>
        ,
      },
      {
        path: "provider",
        element: <ProtectedRoutes>
          <RoleGate only="reseller">
            <Provider />
          </RoleGate>
        </ProtectedRoutes>
      },
      {
        path: "subReseller",
        element: <ProtectedRoutes>
          <RoleGate only="reseller">
            <SubReseller />
          </RoleGate>
        </ProtectedRoutes>
      },
      {
        path: "resellers",
        element: <ProtectedRoutes>
          <RoleGate only="manager">
            <ManagerResellers />
          </RoleGate>
        </ProtectedRoutes>
      },
      {
        // Both roles: managers see the full ledger, resellers their own balance changes.
        path: "credit-history",
        element: <ProtectedRoutes>
          <CreditHistory />
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
