import { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import type { User } from '../types';
import './UsersPage.css';

type SortKey = 'id' | 'username' | 'name' | 'email' | 'role' | 'is_active' | 'created_at';
type SortOrder = 'asc' | 'desc';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getUsers();
      setUsers(response.data.users);
    } catch (err) {
      console.error('ユーザー一覧の取得に失敗しました', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: any = a[sortKey];
    let bValue: any = b[sortKey];

    // null/undefined の処理
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // 文字列比較
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userApi.createUser(newUser);
      setShowCreateModal(false);
      setNewUser({ username: '', password: '', name: '', email: '', role: 'user' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'ユーザーの作成に失敗しました');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await userApi.updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        is_active: editingUser.is_active,
      });
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
      alert('ユーザー情報を更新しました');
    } catch (err: any) {
      alert(err.response?.data?.error || 'ユーザー情報の更新に失敗しました');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return <span className="sort-indicator">{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>;
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1 className="page-title">ユーザー管理</h1>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          新規ユーザー作成
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className="sortable">
                ID<SortIndicator columnKey="id" />
              </th>
              <th onClick={() => handleSort('username')} className="sortable">
                ユーザー名<SortIndicator columnKey="username" />
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                氏名<SortIndicator columnKey="name" />
              </th>
              <th onClick={() => handleSort('email')} className="sortable">
                メールアドレス<SortIndicator columnKey="email" />
              </th>
              <th onClick={() => handleSort('role')} className="sortable">
                権限<SortIndicator columnKey="role" />
              </th>
              <th onClick={() => handleSort('is_active')} className="sortable">
                状態<SortIndicator columnKey="is_active" />
              </th>
              <th onClick={() => handleSort('created_at')} className="sortable">
                登録日<SortIndicator columnKey="created_at" />
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? '管理者' : '一般'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <button
                    onClick={() => handleEdit(user)}
                    className="btn-edit"
                  >
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 新規作成モーダル */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>新規ユーザー作成</h2>
            <form onSubmit={handleCreate} className="user-form">
              <div className="form-group">
                <label>ユーザー名 *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>パスワード *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>氏名 *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>メールアドレス</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>権限 *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="form-input"
                >
                  <option value="user">一般ユーザー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>ユーザー編集</h2>
            <form onSubmit={handleUpdate} className="user-form">
              <div className="form-group">
                <label>ID</label>
                <input
                  type="text"
                  value={editingUser.id}
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>ユーザー名</label>
                <input
                  type="text"
                  value={editingUser.username}
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>氏名 *</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>メールアドレス</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>権限 *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })
                  }
                  className="form-input"
                >
                  <option value="user">一般ユーザー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div className="form-group">
                <label>状態 *</label>
                <select
                  value={editingUser.is_active}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, is_active: Number(e.target.value) })
                  }
                  className="form-input"
                >
                  <option value={1}>有効</option>
                  <option value={0}>無効</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
