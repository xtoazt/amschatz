import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SchoolwideChatButtonProps {
  username: string;
}

export function SchoolwideChatButton({ username }: SchoolwideChatButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // Store username in sessionStorage so SchoolwideChatPage can retrieve it
    sessionStorage.setItem('schoolwide_chat_username', username);
    navigate('/schoolwide-chat');
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 rounded-md flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-md"
    >
      <Users className="w-5 h-5" />
      Schoolwide Chat
    </button>
  );
}
