function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400 py-6 mt-auto border-t border-gray-800">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <p>&copy; {new Date().getFullYear()} BPM Analyzer. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
