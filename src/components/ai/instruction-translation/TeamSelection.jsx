

import { motion } from "framer-motion";

const TeamSelection = ({
    teams,
    setSelectedTeam,
    currentStep,
    setCurrentStep
}) => {
    const handleTeamSelect = (team) => {
        setSelectedTeam(team.code);
        setCurrentStep(currentStep + 1);
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {
                teams.map((team, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Team
                            team={team}
                            onSelect={() => handleTeamSelect(team)}
                        />
                    </motion.div>
                ))
            }
        </div>
    )
}

const Team = ({ team, onSelect }) => {
    return (
        <button
            onClick={onSelect}
            className="w-full group relative flex flex-col items-center justify-center p-6 h-40 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 text-slate-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
            <div className="w-12 h-12 mb-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <span className="text-xl font-bold">{team.name.charAt(0)}</span>
            </div>
            <h2 className="text-lg font-semibold">{team.name}</h2>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-50 rounded-xl pointer-events-none" />
        </button>
    );
}
export default TeamSelection;