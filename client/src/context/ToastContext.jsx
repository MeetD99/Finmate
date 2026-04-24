import { Toaster, toast } from 'react-hot-toast'

export const ToasterProvider = ({ children }) => (
    <>
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#1e293b',
                    color: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '14px'
                },
                success: {
                    iconTheme: {
                        primary: '#22c55e',
                        secondary: '#1e293b'
                    }
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#1e293b'
                    }
                }
            }}
        />
        {children}
    </>
)

export const showError = (message) => {
    toast.error(message, {
        icon: '⚠️'
    })
}

export const showSuccess = (message) => {
    toast.success(message, {
        icon: '✓'
    })
}

export const showLoading = (message) => {
    toast.loading(message, {
        icon: '⏳'
    })
}