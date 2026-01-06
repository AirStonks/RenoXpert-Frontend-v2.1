// src/components/ErrorBoundary.tsx
// Error boundary component to catch and display React errors gracefully

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary component that catches React errors and displays a fallback UI
 * @param {ReactNode} children - Child components to wrap
 * @param {ReactNode} fallback - Optional custom fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="d-flex flex-column flex-root">
                    <div className="d-flex flex-column flex-center flex-column-fluid">
                        <div className="d-flex flex-column flex-center text-center p-10">
                            <div className="card card-flush w-lg-650px py-5">
                                <div className="card-body py-15 py-lg-20">
                                    <h1 className="fw-bolder fs-2hx text-gray-900 mb-4">Oops!</h1>
                                    <div className="fw-semibold fs-6 text-gray-500 mb-7">
                                        Something went wrong. Please try again later.
                                    </div>
                                    {this.state.error && (
                                        <div className="mb-0">
                                            <code className="text-danger">{this.state.error.message}</code>
                                        </div>
                                    )}
                                    <div className="mb-0">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            onClick={() => {
                                                this.setState({ hasError: false, error: null });
                                                window.location.reload();
                                            }}
                                        >
                                            Reload Page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

