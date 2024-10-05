import { Link } from 'react-router-dom';

function Sidebar() {
  return <div
    className="sidebar dark:bg-coal-600 bg-light border-r border-r-gray-200 dark:border-r-coal-100 fixed top-0 bottom-0 z-20 hidden lg:flex flex-col items-stretch shrink-0"
    data-drawer="true"
    data-drawer-class="drawer drawer-start top-0 bottom-0"
    data-drawer-enable="true|lg:false"
    id="sidebar"
  >
    <div
      className="sidebar-header hidden lg:flex items-center relative justify-center mt-4 px-3 lg:px-6 shrink-0"
      id="sidebar_header"
    >
      <Link className="dark:hidden" to="/">
        <img
          className="default-logo min-h-[22px] h-[65px] max-w-none"
          src="/app/RenoExpert_logo-01.svg"
        />
        <img
          className="small-logo min-h-[22px] max-w-none"
          src="/app/RenoExpert_icon-01.svg"
        />
      </Link>
      <Link className="hidden dark:block" to="/">
        <img
          className="default-logo min-h-[22px] h-[65px] max-w-none"
          src="/app/RenoExpert_logo-01.svg"
        />
        <img
          className="small-logo min-h-[22px] max-w-none"
          src="/app/RenoExpert_icon-01.svg"
        />
      </Link>
      <button
        className="btn btn-icon btn-icon-md size-[30px] rounded-lg border border-gray-200 dark:border-gray-300 bg-light text-gray-500 hover:text-gray-700 toggle absolute left-full top-2/4 -translate-x-2/4 -translate-y-2/4"
        data-toggle="body"
        data-toggle-class="sidebar-collapse"
        id="sidebar_toggle"
      >
        <i className="ki-filled ki-black-left-line toggle-active:rotate-180 transition-all duration-300"></i>
      </button>
    </div>
    <div
      className="sidebar-content flex grow shrink-0 py-5 pr-2"
      id="sidebar_content"
    >
      <div
        className="scrollable-y-hover grow shrink-0 flex pl-2 lg:pl-5 pr-1 lg:pr-3"
        data-scrollable="true"
        data-scrollable-dependencies="#sidebar_header"
        data-scrollable-height="auto"
        data-scrollable-offset="0px"
        data-scrollable-wrappers="#sidebar_content"
        id="sidebar_scrollable"
      >
        <div
          className="menu flex flex-col grow gap-0.5"
          data-menu="true"
          data-menu-accordion-expand-all="false"
          id="sidebar_menu"
        >
          <div className="menu-item">
            <Link to="/" className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px] menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg">
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-element-11 text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Dashboards
              </span>
            </Link>
          </div>
          <div className="menu-item pt-2.25 pb-px">
            <span className="menu-heading uppercase pl-[10px] pr-[10px] text-2sm font-semibold text-gray-500">
              Components
            </span>
          </div>
          <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-cube-2 text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Product
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div
                className="menu-item"
                data-menu-item-toggle="accordion"
                data-menu-item-trigger="click"
              >
                <div
                  className="menu-link border border-transparent gap-[14px] pl-[10px] pr-[10px] py-[8px] grow cursor-pointer"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium mr-1 text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Product Management
                  </span>
                  <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                    <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                    <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
                  </span>
                </div>
                <div className="menu-accordion gap-0.5 relative before:absolute before:left-[32px] pl-[22px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
                  <div className="menu-item">
                    <Link to="/products"
                      className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                      tabIndex={0}
                    >
                      <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                      <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                        Overview
                      </span>
                    </Link>
                  </div>
                  <div className="menu-item">
                    <Link to="/products/create"
                      className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                      tabIndex={0}
                    >
                      <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                      <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                        Create New Product
                      </span>
                    </Link>
                  </div>
                  <div className="menu-item">
                    <Link to="/products/category"
                      className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                      tabIndex={0}
                    >
                      <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                      <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                        Product Category
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
              <div
                className="menu-item"
                data-menu-item-toggle="accordion"
                data-menu-item-trigger="click"
              >
                <div
                  className="menu-link border border-transparent gap-[14px] pl-[10px] pr-[10px] py-[8px] grow cursor-pointer"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium mr-1 text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Package
                  </span>
                  <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                    <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                    <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
                  </span>
                </div>
                <div className="menu-accordion gap-0.5 relative before:absolute before:left-[32px] pl-[22px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
                  <div className="menu-item">
                    <Link to="/packages"
                      className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                      tabIndex={0}
                    >
                      <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                      <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                        Overview
                      </span>
                    </Link>
                  </div>
                  <div className="menu-item">
                    <Link to="/packages/create"
                      className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                      tabIndex={0}
                    >
                      <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                      <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                        Create New Package
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-tablet-text-down text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Quotation
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div className="menu-item">
                <Link
                  to={'/quotations'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Quotations
                  </span>
                </Link>
              </div>
              <div className="menu-item">
                <Link
                  to={'/quotations/create'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Create New Quotation
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-address-book text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Contacts
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div className="menu-item">
                <Link
                  to={'/contacts'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    All Contacts
                  </span>
                </Link>
              </div>
              <div className="menu-item">
                <Link
                  to={'/contacts'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Add New Contact
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-safe-home text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Property
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div className="menu-item">
                <Link
                  to={'/properties'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    All Property
                  </span>
                </Link>
              </div>
              <div className="menu-item">
                <Link
                  to={'/properties/create'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Add New Property
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-percentage"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
              Fees and Discounts
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div className="menu-item">
                <Link
                  to={'/discountFee'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Fees and Discounts Mgnt
                  </span>
                </Link>
              </div>
              <div className="menu-item">
                <Link
                  to={'/discountFee/create'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Add Discount/Fee
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <div className="menu-item pt-2.25 pb-px">
            <span className="menu-heading uppercase pl-[10px] pr-[10px] text-2sm font-semibold text-gray-500">
              Sales
            </span>
          </div>
          <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-delivery-door text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Order
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div className="menu-item">
                <Link
                  to={'/orders'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Order List
                  </span>
                </Link>
              </div>
              <div className="menu-item">
                <Link
                  to={'/orders/create'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Add New Order
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-tag text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Sales
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div className="menu-item">
                <Link
                  to={'/sales'}
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Sales Overview
                  </span>
                </Link>
              </div>
            </div>
          </div>
          {/* <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-document text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Invoice
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div className="menu-item">
                <a
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  href="html/demo1/public-profile/works.html"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Works
                  </span>
                </a>
              </div>
              <div className="menu-item">
                <a
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  href="html/demo1/public-profile/teams.html"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Teams
                  </span>
                </a>
              </div>
              <div className="menu-item">
                <a
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  href="html/demo1/public-profile/network.html"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Network
                  </span>
                </a>
              </div>
              <div className="menu-item">
                <a
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  href="html/demo1/public-profile/activity.html"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Activity
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div
            className="menu-item"
            data-menu-item-toggle="accordion"
            data-menu-item-trigger="click"
          >
            <div
              className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px]"
              tabIndex={0}
            >
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-dollar text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Payment
              </span>
              <span className="menu-arrow text-gray-400 w-[20px] shrink-0 justify-end ml-1 mr-[-10px]">
                <i className="ki-filled ki-plus text-2xs menu-item-show:hidden"></i>
                <i className="ki-filled ki-minus text-2xs hidden menu-item-show:inline-flex"></i>
              </span>
            </div>
            <div className="menu-accordion gap-0.5 pl-[10px] relative before:absolute before:left-[20px] before:top-0 before:bottom-0 before:border-l before:border-gray-200">
              <div className="menu-item">
                <a
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  href="html/demo1/public-profile/works.html"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Works
                  </span>
                </a>
              </div>
              <div className="menu-item">
                <a
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  href="html/demo1/public-profile/teams.html"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Teams
                  </span>
                </a>
              </div>
              <div className="menu-item">
                <a
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  href="html/demo1/public-profile/network.html"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Network
                  </span>
                </a>
              </div>
              <div className="menu-item">
                <a
                  className="menu-link gap-[14px] pl-[10px] pr-[10px] py-[8px] border border-transparent items-center grow menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg"
                  href="html/demo1/public-profile/activity.html"
                  tabIndex={0}
                >
                  <span className="menu-bullet flex w-[6px] relative before:absolute before:top-0 before:size-[6px] before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 menu-item-active:before:bg-primary menu-item-hover:before:bg-primary"></span>
                  <span className="menu-title text-2sm font-medium text-gray-700 menu-item-active:text-primary menu-item-active:font-semibold menu-link-hover:!text-primary">
                    Activity
                  </span>
                </a>
              </div>
            </div>
          </div> */}
          <div className="menu-item pt-2.25 pb-px">
            <span className="menu-heading uppercase pl-[10px] pr-[10px] text-2sm font-semibold text-gray-500">
              Miscellaneous
            </span>
          </div>
          <div className="menu-item">
            <div
              className="menu-label gap-[10px] pl-[10px] pr-[10px] py-[6px] border border-transparent"
              tabIndex={0}
            >
              <span className="menu-icon items-start w-[20px] text-gray-500 dark:text-gray-400">
                <i className="ki-filled ki-users text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700">
                Users
              </span>
              <span className="menu-badge mr-[-10px]">
                <span className="badge badge-xs">Soon</span>
              </span>
            </div>
          </div>
          <div className="menu-item">
            <Link to="/test" className="menu-link flex items-center grow cursor-pointer border border-transparent gap-[10px] pl-[10px] pr-[10px] py-[6px] menu-item-active:bg-secondary-active dark:menu-item-active:bg-coal-300 dark:menu-item-active:border-gray-100 menu-item-active:rounded-lg hover:bg-secondary-active dark:hover:bg-coal-300 dark:hover:border-gray-100 hover:rounded-lg">
              <span className="menu-icon items-start text-gray-500 dark:text-gray-400 w-[20px]">
                <i className="ki-filled ki-wrench text-lg"></i>
              </span>
              <span className="menu-title text-sm font-semibold text-gray-700 menu-item-active:text-primary menu-link-hover:!text-primary">
                Testing
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default Sidebar
