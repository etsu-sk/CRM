import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companyApi } from '../services/api';
import type { Company, Pagination } from '../types';
import './CompaniesPage.css';

type SortKey = 'id' | 'name' | 'phone' | 'address' | 'created_at';
type SortOrder = 'asc' | 'desc';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [newCompany, setNewCompany] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    fetchCompanies();
  }, [search]);

  const fetchCompanies = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await companyApi.getCompanies({ search, page, limit: 20 });
      setCompanies(response.data.companies);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError('顧客一覧の取得に失敗しました');
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

  const sortedCompanies = [...companies].sort((a, b) => {
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
      await companyApi.createCompany(newCompany);
      setShowModal(false);
      setNewCompany({ name: '', phone: '', address: '' });
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.error || '顧客の作成に失敗しました');
    }
  };

  const handlePageChange = (page: number) => {
    fetchCompanies(page);
  };

  const SortIndicator = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return <span className="sort-indicator">{sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>;
  };

  return (
    <div className="companies-page">
      <div className="page-header">
        <h1 className="page-title">顧客一覧</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          新規顧客登録
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="search-box">
        <input
          type="text"
          placeholder="会社名、住所で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : companies.length === 0 ? (
        <p className="no-data">顧客が見つかりませんでした</p>
      ) : (
        <>
          <div className="companies-table-container">
            <table className="companies-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')} className="sortable">
                    ID<SortIndicator columnKey="id" />
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    会社名<SortIndicator columnKey="name" />
                  </th>
                  <th onClick={() => handleSort('phone')} className="sortable">
                    電話番号<SortIndicator columnKey="phone" />
                  </th>
                  <th onClick={() => handleSort('address')} className="sortable">
                    住所<SortIndicator columnKey="address" />
                  </th>
                  <th>担当者</th>
                  <th onClick={() => handleSort('created_at')} className="sortable">
                    登録日<SortIndicator columnKey="created_at" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.id}</td>
                    <td>
                      <Link to={`/companies/${company.id}`} className="company-link">
                        {company.name}
                      </Link>
                    </td>
                    <td>{company.phone || '-'}</td>
                    <td>{company.address || '-'}</td>
                    <td>{company.assigned_users || '-'}</td>
                    <td>{new Date(company.created_at).toLocaleDateString('ja-JP')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                前へ
              </button>
              <span className="pagination-info">
                {pagination.page} / {pagination.totalPages} ページ
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="pagination-btn"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}

      {/* 新規作成モーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>新規顧客登録</h2>
            <form onSubmit={handleCreate} className="company-form">
              <div className="form-group">
                <label>会社名 *</label>
                <input
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>電話番号</label>
                <input
                  type="text"
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>住所</label>
                <input
                  type="text"
                  value={newCompany.address}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  登録
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesPage;
