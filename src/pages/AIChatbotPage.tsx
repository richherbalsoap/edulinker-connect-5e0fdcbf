import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useAppStore from '@/store/appStore';

const AIChatbotPage = () => {
  const results = useAppStore(state => state.results);
  const students = useAppStore(state => state.students);
  const fetchAll = useAppStore(state => state.fetchAll);

  useEffect(() => { fetchAll(); }, []);

  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI assistant. Ask me about any student's marks, class performance, or school data. For example, type a student's name to see their results.", sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [inputValue, setInputValue] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; }, [messages]);

  const findStudentResults = (query: string) => {
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery === 'all students' || lowerQuery === 'list students') {
      if (students.length === 0) return "No students have been added yet.";
      let response = `There are ${students.length} students registered:\n\n`;
      students.forEach(s => { response += `- ${s.name} (Class ${s.standard}-${s.section})\n`; });
      return response;
    }
    if (lowerQuery === 'all results' || lowerQuery === 'results summary') {
      if (results.length === 0) return "No results have been recorded yet.";
      let response = `There are ${results.length} result records:\n\n`;
      results.forEach(r => {
        const studentName = r.student?.name || 'Unknown';
        response += `- ${studentName}: ${r.subject} - ${r.marks_obtained}/${r.total_marks} (${r.percentage}%)\n`;
      });
      return response;
    }
    const matchingResults = results.filter(r => r.student?.name?.toLowerCase().includes(lowerQuery));
    if (matchingResults.length > 0) {
      let response = '';
      const grouped: Record<string, typeof matchingResults> = {};
      matchingResults.forEach(r => {
        const name = r.student?.name || 'Unknown';
        if (!grouped[name]) grouped[name] = [];
        grouped[name].push(r);
      });
      Object.entries(grouped).forEach(([name, recs]) => {
        const student = recs[0].student;
        response += `Results for ${name} (Class ${student?.standard}-${student?.section}):\n`;
        recs.forEach(r => { response += `  - ${r.subject}: ${r.marks_obtained}/${r.total_marks} (${r.percentage}%)\n`; });
        response += '\n';
      });
      return response.trim();
    }
    const matchingStudent = students.find(s => s.name?.toLowerCase().includes(lowerQuery));
    if (matchingStudent) return `Found student: ${matchingStudent.name} (Class ${matchingStudent.standard}-${matchingStudent.section})\nParent: ${matchingStudent.parent_name}\nContact: ${matchingStudent.parent_contact}\n\nNo result records found for this student yet.`;
    return `Sorry, I couldn't find any student or results matching "${query}".\n\nTry:\n- Type a student's name to see their marks\n- Type "all students" to see all registered students\n- Type "all results" to see a summary of all results`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const userMessage = { id: messages.length + 1, text: inputValue, sender: 'user', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMessage]);
    const query = inputValue; setInputValue('');
    await new Promise(resolve => setTimeout(resolve, 300));
    const botResponse = findStudentResults(query);
    setMessages(prev => [...prev, { id: prev.length + 1, text: botResponse, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  };

  return (
    <div className="space-y-6 relative z-10 px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center">AI Insight Chatbot</h1>
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-xl overflow-hidden flex flex-col max-w-4xl mx-auto" style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.sender === 'bot' ? 'bg-primary/20 border border-primary/30' : 'bg-foreground/10 border border-foreground/20'}`}>
                  {message.sender === 'bot' ? <Bot size={18} className="text-primary" /> : <User size={18} className="text-foreground" />}
                </div>
                <div>
                  <div className={`rounded-2xl px-4 py-3 ${message.sender === 'bot' ? 'bg-black/40 border border-primary/10' : 'bg-primary/15 border border-primary/25'}`}>
                    <p className="text-foreground text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
                  </div>
                  <p className="text-foreground/40 text-xs mt-1 px-2">{message.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-primary/20 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Type a student name or 'all students'..." className="flex-1 px-4 py-3 bg-black/40 border border-primary/20 rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40" />
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 rounded-lg shadow-[0_0_20px_hsl(51,100%,50%,0.3)]"><Send size={20} /></Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatbotPage;
