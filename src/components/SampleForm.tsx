function SampleForm() {
    return (
        <>
            <div className="input-group">
                <span className="btn btn-input">
                    Add on
                </span>
                <input className="input" placeholder="Example input" type="text" value="" />
            </div>
            <div className="input-group">
                <input className="input" placeholder="Example input" type="text" value="" />
                <span className="btn btn-input">
                    Add on
                </span>
            </div>
        </>
    );
}

export default SampleForm;