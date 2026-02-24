import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Repeat, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAppStore from '@/store/appStore';

const standards = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const getSortableClassIndex = (classVal: string) => {
  const standard = classVal.replace('Class ', '');
  return standards.indexOf(standard) === -1 ? Infinity : standards.indexOf(standard);
};

const getNextStandard = (currentStandard: string) => {
  const currentIndex = standards.indexOf(currentStandard);
  if (currentIndex > -1 && currentIndex < standards.length - 1) return standards[currentIndex + 1];
  return null;
};

const PromotionPanelPage = () => {
  const { toast } = useToast();
  const students = useAppStore(state => state.students);
  const updateStudent = useAppStore(state => state.updateStudent);
  const deleteStudentFromStore = useAppStore(state => state.deleteStudent);
  const fetchStudents = useAppStore(state => state.fetchStudents);
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [searchTerm, setSearchTerm] = useState('');

  // Bulk promotion state
  const [bulkFromClass, setBulkFromClass] = useState('');
  const [bulkSection, setBulkSection] = useState('');
  const [isBulkPromoting, setIsBulkPromoting] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const handleAction = async (id: string, action: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;
    let title = '', description = '';
    switch (action) {
      case 'promote': {
        const nextClass = getNextStandard(student.standard);
        if (nextClass) {
          await updateStudent(id, { standard: nextClass });
          title = "Student Promoted!";
          description = `${student.name} has been promoted to Class ${nextClass}.`;
        } else {
          await deleteStudentFromStore(id);
          title = "Student Graduated!";
          description = `${student.name} has graduated.`;
        }
        break;
      }
      case 'delete':
        await deleteStudentFromStore(id);
        title = "Student Deleted";
        description = `${student.name} has been removed.`;
        break;
      case 'repeat':
        title = "Student to Repeat";
        description = `${student.name} will repeat Class ${student.standard}.`;
        break;
      default: return;
    }
    toast({ title, description, variant: action === 'delete' ? 'destructive' : 'default' });
  };

  const handleBulkPromote = async () => {
    if (!bulkFromClass) {
      toast({ title: 'Select a class', description: 'Choose a class to promote from.', variant: 'destructive' });
      return;
    }
    const nextClass = getNextStandard(bulkFromClass);
    const targets = students.filter(s => {
      if (s.standard !== bulkFromClass) return false;
      if (bulkSection && s.section !== bulkSection) return false;
      return true;
    });
    if (targets.length === 0) {
      toast({ title: 'No students found', description: 'No students in the selected class/section.', variant: 'destructive' });
      return;
    }
    setIsBulkPromoting(true);
    let promoted = 0, graduated = 0;
    for (const s of targets) {
      if (nextClass) {
        await updateStudent(s.id, { standard: nextClass });
        promoted++;
      } else {
        await deleteStudentFromStore(s.id);
        graduated++;
      }
    }
    toast({
      title: 'Bulk Promotion Complete!',
      description: nextClass
        ? `${promoted} student(s) promoted to Class ${nextClass}.${bulkSection ? ` (Section ${bulkSection})` : ''}`
        : `${graduated} student(s) graduated.`,
    });
    setIsBulkPromoting(false);
    setBulkFromClass('');
    setBulkSection('');
  };

  const availableClasses = useMemo(() => [...new Set(students.map(s => `Class ${s.standard}`))].sort((a, b) => getSortableClassIndex(a) - getSortableClassIndex(b)), [students]);
  const availableSections = useMemo(() => [...new Set(students.map(s => s.section))].sort(), [students]);

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => selectedClass === 'All Classes' || `Class ${s.standard}` === selectedClass)
      .filter(s => selectedSection === 'All Sections' || s.section === selectedSection)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, selectedClass, selectedSection, searchTerm]);

  const groupedStudents = useMemo(() => {
    const groups = filteredStudents.reduce((acc: any, student) => {
      const classKey = `Class ${student.standard}`;
      if (!acc[classKey]) acc[classKey] = [];
      acc[classKey].push(student);
      return acc;
    }, {});
    return Object.keys(groups).sort((a, b) => getSortableClassIndex(a) - getSortableClassIndex(b)).reduce((acc: any, key) => { acc[key] = groups[key]; return acc; }, {});
  }, [filteredStudents]);

  return (
    <div className="space-y-4 px-4 pb-10 relative z-10 py-6">
      <div className="text-center pt-4">
        <h1 className="text-3xl font-bold text-foreground">Promotion Panel</h1>
        <p className="text-foreground/70">Manage student promotions for the new academic year</p>
      </div>

      {/* Bulk Promotion */}
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center"><Users size={20} className="text-primary" /></div>
          <h2 className="text-lg font-semibold text-foreground">Bulk Promotion</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">FROM CLASS</label>
            <Select value={bulkFromClass} onValueChange={setBulkFromClass}>
              <SelectTrigger className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                {standards.map(s => <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary">Class {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">TO CLASS</label>
            <div className="w-full px-4 py-3 bg-black/20 border-primary/10 border rounded-lg text-foreground/60">
              {bulkFromClass ? (getNextStandard(bulkFromClass) ? `Class ${getNextStandard(bulkFromClass)}` : 'Graduate') : '—'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SECTION (Optional)</label>
            <Select value={bulkSection} onValueChange={setBulkSection}>
              <SelectTrigger className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground"><SelectValue placeholder="All Sections" /></SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                <SelectItem value="" className="text-foreground focus:bg-primary/10 focus:text-primary">All Sections</SelectItem>
                {['A', 'B', 'C', 'D', 'E'].map(s => <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleBulkPromote} disabled={isBulkPromoting || !bulkFromClass} className="w-full bg-green-400/20 hover:bg-green-400/30 text-green-300 font-bold py-3 rounded-lg border border-green-400/30">
          <CheckCircle size={18} className="mr-2" />{isBulkPromoting ? 'Promoting...' : 'Promote All'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-6 max-w-4xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">CLASS</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                <SelectItem value="All Classes" className="text-foreground focus:bg-primary/10 focus:text-primary">All Classes</SelectItem>
                {availableClasses.map(c => <SelectItem key={c} value={c} className="text-foreground focus:bg-primary/10 focus:text-primary">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">SECTION</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground"><SelectValue placeholder="All Sections" /></SelectTrigger>
              <SelectContent className="bg-black border border-primary/20 max-h-60 overflow-y-auto">
                <SelectItem value="All Sections" className="text-foreground focus:bg-primary/10 focus:text-primary">All Sections</SelectItem>
                {availableSections.map(s => <SelectItem key={s} value={s} className="text-foreground focus:bg-primary/10 focus:text-primary">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold tracking-wider text-primary/60 mb-2">STUDENT NAME</label>
            <input type="text" placeholder="Search student..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-black/40 border-primary/20 border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
      </div>

      <div className="space-y-8 max-w-4xl mx-auto">
        {Object.keys(groupedStudents).length > 0 ? (
          Object.keys(groupedStudents).map(classGroup => (
            <div key={classGroup}>
              <h2 className="text-foreground text-xl font-bold mb-3 px-2">{classGroup}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedStudents[classGroup].map((student: any) => {
                  const nextClass = getNextStandard(student.standard);
                  return (
                    <div key={student.id} className="bg-black/30 backdrop-blur-md border border-primary/20 rounded-2xl p-4 space-y-4 hover:border-primary/40 hover:shadow-[0_0_20px_hsl(51,100%,50%,0.15)] transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div><h3 className="font-bold text-xl text-foreground">{student.name}</h3><p className="text-xs text-foreground/50">Section {student.section}</p></div>
                      </div>
                      <div className="space-y-2">
                        <Button onClick={() => handleAction(student.id, 'promote')} className="w-full bg-green-400/20 hover:bg-green-400/30 text-green-300 font-bold py-2 rounded-lg border border-green-400/30 text-sm">
                          <CheckCircle size={16} className="mr-2" />{nextClass ? `Promote to Class ${nextClass}` : 'Graduate'}
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button onClick={() => handleAction(student.id, 'repeat')} className="w-full bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 font-bold py-2 rounded-lg border border-yellow-400/30 text-sm"><Repeat size={16} className="mr-2" />Repeat</Button>
                          <Button onClick={() => handleAction(student.id, 'delete')} className="w-full bg-red-400/20 hover:bg-red-400/30 text-red-300 font-bold py-2 rounded-lg border border-red-400/30 text-sm"><Trash2 size={16} className="mr-2" />Delete</Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-foreground/50 text-lg">No students found.</p>
            <p className="text-foreground/40">Add students first from the Student Management page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionPanelPage;
