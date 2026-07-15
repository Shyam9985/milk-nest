import UnderDevelopment from '../../utils/UnderDevelopment';

function Branch() {
    return (
        <UnderDevelopment
            title="Branch"
            subtitle="Branch master is being prepared"
            description="Branch-specific setup details will appear here in a future update."
            backRoute="/settings"
            buttonLabel="Back to Settings"
        />
    );
}

export default Branch;
