import { Github, Linkedin, MoveRight, Twitter } from 'lucide-react'
import React from 'react'

const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-transparent py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">LegalAI</h3>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">AI-powered legal clarity in seconds.</p>
                    <form className="mt-4 flex gap-2">
                        <input type="email" placeholder="Subscribe for updates" className="w-full max-w-xs rounded-md border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none transition-shadow" />
                        <button className="flex-shrink-0 rounded-md bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-2 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors">
                            <MoveRight className="w-5 h-5" />
                        </button>
                    </form>
                </div>
                <div className="text-sm">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200">Product</h4>
                    <ul className="mt-2 space-y-2">
                        {['Features', 'Pricing', 'Security', 'FAQ'].map(link => <li key={link}><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-teal-500 transition-colors">{link}</a></li>)}
                    </ul>
                </div>
                <div className="text-sm">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200">Company</h4>
                    <ul className="mt-2 space-y-2">
                        {['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'].map(link => <li key={link}><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-teal-500 transition-colors">{link}</a></li>)}
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm text-slate-400 dark:text-slate-500">
                <p>&copy; {new Date().getFullYear()} LegalAI. All rights reserved.</p>
                <div className="flex space-x-4">
                    <a href="#" className="hover:text-blue-500 transition-colors"><Twitter /></a>
                    <a href="#" className="hover:text-blue-700 transition-colors"><Linkedin /></a>
                    <a href="#" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"><Github /></a>
                </div>
            </div>
        </footer>
  )
}

export default Footer