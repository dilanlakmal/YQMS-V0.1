export default function Header(){
    return (
        <header className="border-b border-translator-border bg-translator-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-translator-primary">
                <svg className="w-6 h-6 text-translator-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a1 1 0 01-2 0V5H4v5h4a1 1 0 011 1v2a1 1 0 11-2 0v-1H2V5z" />
                <path d="M15 9a1 1 0 011 1v5h-4a1 1 0 110-2h3v-3a1 1 0 011-1z" />
                </svg>
            </div>
            <div>
                <h1 className="text-2xl font-bold text-translator-foreground">Yai-Translator</h1>
                {/* <p className="text-xs text-translator-muted-foreground">Yorkmars Company</p> */}
            </div>
            </div>
            <div className="text-right hidden sm:block">
            {/* <p className="text-xs font-medium text-translator-primary">AI Powered</p> */}
            <p className="text-xs text-translator-muted-foreground">Multi-Language Support</p>
            </div>
        </div>
        </header>
    );
}