import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import Login from './components/login';
import Account from './components/account'; // This is the new page component
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

const PrivateRoute = ({ element, ...rest }) => {
  return isAuthenticated() ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <div>
      <header>
        <nav class="navbar">
          <PictureButton src="/images/random-logos/nft-nexus.png" alt="Home" to="/"/>
          <ul class="nav-links">
            <li><a href="/browse">Browse NFTs</a></li>
            <li><a href="/wallet-explorer">Wallet Explorer</a></li>
            <li><a href="/guides">Guides</a></li>
            <li><a href="/account">My Profile</a></li>
            <li><AuthButton /></li>
          </ul>
        </nav>
      </header>
      
      <div class="main-body">
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home page content */}
          <Route path="/browse" element={<Browse />} /> {/* Login page content */}
          <Route path="/login" element={<Login />} /> {/* Login page content */}
          <Route path="/account" element={<PrivateRoute element={<Account />} />} /> {/* Account page content */}
          <Route path="/register" element={<Register />} />
          <Route path="/wallet-explorer" element={<WalletExplorer />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="*" element={<Navigate to="/" />} /> {/* Redirect unknown routes to home */}
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
  );
}

export default App;