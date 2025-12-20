


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
        <div className="p-6 rounded-lg m-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {
                teams.map((team) => (
                    <Team
                        key={team.id}
                        team={team}
                        onSelect={() => handleTeamSelect(team)}
                    />
                ))
            }
        </div>
    )
}

const Team = ({ team, onSelect }) => {
    return (
        <button onClick={onSelect} className="w-full text-center p-4 border border-blue-500 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <h2 className="text-xl text-white font-sans">{team.name}</h2>
        </button>
    );
}
export default TeamSelection;