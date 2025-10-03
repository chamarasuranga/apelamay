
import React from "react";

type InfoBoxProps = {
    mode: "hint" | "warning" | "info";
    children?: React.ReactNode;
}


export default function InfoBox({ mode, children }: InfoBoxProps) {


    if (mode === 'hint') {

        return (
            <aside className="info-box info-box-hint">
                {children}
            </aside>
        );

    }


    return (
        <div className="info-box info-box-warning">
            {children}
        </div>
    );
}
