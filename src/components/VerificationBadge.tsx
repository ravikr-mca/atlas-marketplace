import { Chip, Tooltip } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import type { Organization } from '../types/entities';

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** The visible answer to "what establishes trust": every organization shows its accreditation state, with what it means. */
export function VerificationBadge({ organization, size = 'small' }: { organization: Pick<Organization, 'accreditation' | 'verifiedAt' | 'kind'>; size?: 'small' | 'medium' }) {
  const noun = organization.kind === 'FUND_MANAGER' ? 'manager' : 'investor';
  const spec = {
    VERIFIED: {
      label: 'Verified', color: 'success' as const, icon: <VerifiedIcon />,
      tip: `Greenstone has checked this ${noun}'s identity, regulatory status and accreditation${organization.verifiedAt ? ` (verified ${DATE.format(new Date(organization.verifiedAt))})` : ''}. Verified organizations can transact on Atlas.`,
    },
    PENDING: {
      label: 'Pending review', color: 'warning' as const, icon: <HourglassTopIcon />,
      tip: `This ${noun}'s accreditation documents are with Greenstone for review. Until approved they can browse, but not transact.`,
    },
    UNVERIFIED: {
      label: 'Not verified', color: 'default' as const, icon: <ShieldOutlinedIcon />,
      tip: `This ${noun} hasn't completed Greenstone's accreditation review, so can't yet transact on Atlas.`,
    },
  }[organization.accreditation];

  return (
    <Tooltip title={spec.tip} arrow enterTouchDelay={0}>
      <Chip size={size} color={spec.color} icon={spec.icon} label={spec.label} variant={organization.accreditation === 'VERIFIED' ? 'filled' : 'outlined'} tabIndex={0} />
    </Tooltip>
  );
}
