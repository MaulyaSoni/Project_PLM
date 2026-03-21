import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateECODialog from '@/components/CreateECODialog';

export default function ECOCreatePage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <CreateECODialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) navigate('/ecos');
      }}
    />
  );
}
