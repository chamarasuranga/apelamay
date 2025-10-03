import { ComponentPropsWithoutRef } from "react";


type InputProps = {
    // Define any props you want to pass to the Input component
    label:string
    id:string
} & ComponentPropsWithoutRef<'input'>;

export default function Input({ label, id ,...props}: InputProps) {
        return (
            <p> 
                <label htmlFor={id}>{label}</label>
                <input id={id} type="text" placeholder={`Enter your ${label.toLowerCase()}`} {...props} />
            </p>
        );
    }
