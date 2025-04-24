// Converted from TypeScript and moved to public/scripts/
function Counter(props) {
    const { label, decrementTitle, initialValue = 0 } = props;
    const [count, setCount] = React.useState(initialValue);

    return {
        increment: () => setCount(count + 1),
        decrement: () => setCount(count - 1),
        getCount: () => count,
        render: () => `
            <div class="counter">
                <label>${label}</label>
                <div class="counter-controls">
                    <button class="counter-btn decrement" title="${decrementTitle || 'Decrease'}" 
                            onclick="this.parentElement.querySelector('.count').textContent = window.counter.decrement()">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="count">${count}</span>
                    <button class="counter-btn increment" title="Increase"
                            onclick="this.parentElement.querySelector('.count').textContent = window.counter.increment()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        `
    };
}

// Export to window for global access
window.Counter = Counter;