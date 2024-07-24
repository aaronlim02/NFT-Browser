import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/login';
import Account from './components/account';
import Home from './components/home';
import Register from './components/register';
import WalletExplorer from './components/wallet-explorer';
import Guides from './components/guides';
import PictureButton from './components/PictureButton';
import AuthButton from './components/AuthButton';
import Browse from './components/Browse';
import { isAuthenticated } from './utils/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './socket';
import { ThemeProvider } from './ThemeContext';

const PrivateRoute = ({ element, ...rest }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <div>
        <header>
          <nav className="navbar">
            <PictureButton src="/images/random-logos/nft-nexus.png" alt="Home" to="/"/>
            <ul className="nav-links">
              <li><a href="/browse">Browse NFTs</a></li>
              <li><a href="/wallet-explorer">Wallet Explorer</a></li>
              <li><a href="/guides">Guides</a></li>
              <li><a href="/account">My Profile</a></li>
              <li><AuthButton /></li>
            </ul>
          </nav>
        </header>
        
        <div className="main-body">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<PrivateRoute element={<Account />} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/wallet-explorer" element={<WalletExplorer />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>

          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;