import logoSrc from '../assets/logo.png';

export default function LeafLogo({ size = 22 }) {
  return (
    <img
      src={logoSrc}
      alt="NammaEarth"
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}
