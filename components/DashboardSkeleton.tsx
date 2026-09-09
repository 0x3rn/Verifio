export function DashboardSkeleton() {
  return (
    <div className="dash-layout dash-skeleton" role="status" aria-label="Loading dashboard">
      <header className="dash-header dash-skeleton__header" aria-hidden="true">
        <div className="dash-skeleton__header-copy">
          <span className="dash-skeleton__bar dash-skeleton__title" />
          <span className="dash-skeleton__bar dash-skeleton__subtitle" />
        </div>
        <span className="dash-skeleton__bar dash-skeleton__balance" />
      </header>

      <div className="dash-grid" aria-hidden="true">
        <section className="dash-panel dash-verification-console dash-skeleton__panel">
          <div className="dash-panel__header dash-panel__header--console">
            <span className="dash-skeleton__bar dash-skeleton__panel-title" />
          </div>
          <div className="dash-panel__content dash-panel__content--console">
            <span className="dash-skeleton__bar dash-skeleton__section-label" />
            <span className="dash-skeleton__bar dash-skeleton__segmented" />

            <div className="dash-skeleton__selectors">
              <div className="dash-skeleton__field">
                <span className="dash-skeleton__bar dash-skeleton__field-label" />
                <span className="dash-skeleton__bar dash-skeleton__field-input" />
              </div>
              <div className="dash-skeleton__field">
                <span className="dash-skeleton__bar dash-skeleton__field-label" />
                <span className="dash-skeleton__bar dash-skeleton__field-input" />
              </div>
            </div>

            <div className="dash-skeleton__submit">
              <div>
                <span className="dash-skeleton__bar dash-skeleton__price-label" />
                <span className="dash-skeleton__bar dash-skeleton__price" />
              </div>
              <span className="dash-skeleton__bar dash-skeleton__button" />
            </div>
          </div>
        </section>

        <section className="dash-panel dash-panel--transparent dash-active-console dash-skeleton__panel">
          <div className="dash-panel-heading">
            <span className="dash-skeleton__bar dash-skeleton__panel-title" />
            <span className="dash-skeleton__bar dash-skeleton__history" />
          </div>
          <div className="active-orders-column">
            <div className="dash-skeleton__empty">
              <span className="dash-skeleton__bar dash-skeleton__empty-icon" />
              <span className="dash-skeleton__bar dash-skeleton__empty-title" />
              <span className="dash-skeleton__bar dash-skeleton__empty-copy" />
              <span className="dash-skeleton__bar dash-skeleton__empty-copy dash-skeleton__empty-copy--short" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
