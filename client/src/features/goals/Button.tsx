import { ComponentPropsWithoutRef } from "react";
  

    type  ButtonProps =ComponentPropsWithoutRef<'button'> & {
        el:'button'
    }

    type  AnchorProps = ComponentPropsWithoutRef<'a'> & {
        el:'anchor'
    }

    export default function Button(props: ButtonProps | AnchorProps) {

        if(props.el==='anchor') {
            const { children, ...rest } = props;

            return (
                <a {...rest}>
                    {children}
                </a>
            );
        }

        const { children, ...rest } = props;

        return (
            <button {...rest}>
                {children}
            </button>
        );
    }
