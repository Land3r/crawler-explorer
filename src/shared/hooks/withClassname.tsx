import { IconBaseProps, IconType } from 'react-icons';

interface ExtendedIconProps extends IconBaseProps {
  className?: string;
}

const withClassName = (Icon: IconType) => {
  return (props: ExtendedIconProps) => <Icon {...props} />;
};

export default withClassName;
