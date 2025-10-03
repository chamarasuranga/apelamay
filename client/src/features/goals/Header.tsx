
type HeaderProps = {
    image:{ src:string; alt:string};
    children?: React.ReactNode;
}

export default function Header({ image, children }: HeaderProps) {
    return (
        <>
            <img style={{ width: '200px', borderRadius: '8px' }} src={image.src} alt={image.alt} />
            {children}
        </>
    );
}
