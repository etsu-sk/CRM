import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">CRM システム</h1>
          <nav className="nav">
            <Link to="/" className="nav-link">ダッシュボード</Link>
            <Link to="/companies" className="nav-link">顧客一覧</Link>
            {user?.role === 'admin' && (
              <Link to="/users" className="nav-link">ユーザー管理</Link>
            )}
          </nav>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">({user?.role === 'admin' ? '管理者' : '一般'})</span>
            <button onClick={handleLogout} className="logout-button">
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
