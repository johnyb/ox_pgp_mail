Name:           ox-pgp-mail
BuildArch:      noarch
BuildRequires:  nodejs >= 0.10.0
Requires:	open-xchange-appsuite
Version:        0.0.1
%define         ox_release 1
Release:        1
# use next line to run on a OBS instance
#Release:        %{ox_release}_<CI_CNT>.<B_CNT>
Group:          Applications/Productivity
Vendor:         Open-Xchange
URL:            http://open-xchange.com
Packager:       "Julian Bäume" <julian@svg4all.de>
License:        MIT
Summary:        Support PGP mail handling in AppSuite
Source:         %{name}_%{version}.orig.tar.gz
# use the next line to run build with bz2 compressed sources
#Source:         %{name}_%{version}.orig.tar.bz2
BuildRoot:      %{_tmppath}/%{name}-%{version}-root

%if 0%{?suse_version}
Requires:       apache2
%endif
%if 0%{?fedora_version} || 0%{?rhel_version}
Requires:       httpd
%endif

%if 0%{?rhel_version} || 0%{?fedora_version}
%define docroot /var/www/html/
%else
%define docroot /srv/www/htdocs/
%endif

%description
Support PGP mail handling in AppSuite

%prep

%setup -q

%build

echo "require('grunt').cli()" | node "" dist --no-color

%install
export NO_BRP_CHECK_BYTECODE_VERSION=true
APPSUITE=/opt/open-xchange/appsuite/
echo "require('grunt').cli()" | node "" install:dist --prefix %{buildroot}/opt/open-xchange --htdoc %{buildroot}%{docroot} --no-color
find "%{buildroot}$APPSUITE" -type d | sed -e 's,%{buildroot},%dir ,' > %{name}.files
find "%{buildroot}$APPSUITE" \( -type f -o -type l \) | sed -e 's,%{buildroot},,' >> %{name}.files

%clean
%{__rm} -rf %{buildroot}

%files -f %{name}.files
%defattr(-,root,root)
%dir /opt/open-xchange
%exclude %{docroot}/*

