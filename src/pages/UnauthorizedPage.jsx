import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Result
        status="403"
        title="Access Denied"
        subTitle="You are not authorized to access this page."
        extra={
          <Button type="primary" danger onClick={handleLogout}>
            Logout & Clear Session
          </Button>
        }
      />
    </div>
  );
}
