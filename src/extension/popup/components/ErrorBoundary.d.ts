import React from 'react';
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}
export declare class ErrorBoundary extends React.Component<{
    children: React.ReactNode;
}, ErrorBoundaryState> {
    constructor(props: {
        children: React.ReactNode;
    });
    static getDerivedStateFromError(error: Error): ErrorBoundaryState;
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map